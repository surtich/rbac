import {
  Credential,
  CredentialKey,
  CredentialValue,
  isActionRule,
  Rule,
  RuleValue,
  SingleCredential,
  SingleRule,
  SingleRuleValue
} from "./types";

function equalComparator<T>(x: T, y: T): Promise<boolean> {
  return Promise.resolve(x === y);
}

function flip<T, K, L>(f: (x: K, y: T) => L) {
  return (y: T, x: K) => f(x, y);
}

function some<T, K>(comparator: (x: T, y: K) => Promise<boolean>) {
  return async (x: T, ys: K[]) => {
    for (const y of ys) {
      const match = await comparator(x, y);
      if (match) {
        return true;
      }
    }
    return false;
  };
}

function all<T, K>(comparator: (x: T, y: K) => Promise<boolean>) {
  return async (x: T, obj: { [index: string]: K }) => {
    let key: string;
    for (key in obj) {
      const y: K = obj[key];
      const match = await comparator(x, y);
      if (!match) {
        return false;
      }
    }
    return true;
  };
}

const checkSingleCredential = async (
  rule: SingleRule,
  credential: SingleCredential
) => {
  for (const key in rule) {
    const credentialValue = credential[key as CredentialKey];
    const ruleValue = rule[key as CredentialKey] as SingleRuleValue;
    const f = selectCheckRuleValueFn(ruleValue);
    // @ts-ignore
    const match = await f(credentialValue, ruleValue);
    if (!match) {
      return false;
    }
  }
  return true;
};

const checkSingleRuleValue = (
  credentialValue: CredentialValue,
  ruleValue: SingleRuleValue
): Promise<boolean> => {
  if (Array.isArray(credentialValue)) {
    return some(checkSingleRuleValue)(ruleValue, credentialValue);
  }
  return equalComparator(credentialValue, ruleValue);
};

const selectCheckRuleValueFn = (ruleValue: RuleValue) => {
  if (Array.isArray(ruleValue)) {
    return some(checkSingleRuleValue);
  } else {
    return checkSingleRuleValue;
  }
};

const selectCheckRuleFn = (rule: Rule) => {
  if (Array.isArray(rule)) {
    return some(checkRules);
  } else if (isActionRule(rule)) {
    return flip(some(checkSingleCredential));
  } else {
    return all(checkRules);
  }
};

export const checkRules = (
  credentials: Credential,
  rule: Rule
): Promise<boolean> => {
  const f = selectCheckRuleFn(rule);
  // @ts-ignore
  return f(Array.isArray(credentials) ? credentials : [credentials], rule);
};
