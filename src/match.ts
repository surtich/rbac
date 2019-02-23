import {
  ArrayRule,
  Credential,
  CredentialKey,
  CredentialValue,
  isActionRule,
  ObjectRule,
  Rule,
  RuleValue,
  SingleRule,
  SingleRuleValue
} from "./types";

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

const checkSingleRuleValue = (
  credentialValue: CredentialValue,
  ruleValue: SingleRuleValue
) => {
  return Promise.resolve(credentialValue === ruleValue);
};

const checkSingleCredential = async (
  rule: SingleRule,
  credential: Credential
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

const selectCheckRuleValueFn = (ruleValue: RuleValue) => {
  if (Array.isArray(ruleValue)) {
    return checkArrayRuleValue;
  } else {
    return checkSingleRuleValue;
  }
};

const selectCheckRuleFn = (rule: Rule) => {
  if (Array.isArray(rule)) {
    return checkArrayRule;
  } else if (isActionRule(rule)) {
    return checkCredentials;
  } else {
    return checkObjectRule;
  }
};

export const checkRules = (
  credentials: Credential[],
  rule: Rule
): Promise<boolean> => {
  const f = selectCheckRuleFn(rule);
  // @ts-ignore
  return f(credentials, rule);
};

const checkArrayRule = some(checkRules);

const checkArrayRuleValue = some(checkSingleRuleValue);

const checkCredentials = flip(some(checkSingleCredential));

const checkObjectRule = all(checkRules);
