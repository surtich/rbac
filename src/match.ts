import {
  Credential,
  CredentialKey,
  CredentialValue,
  isRuleValue,
  Rule,
  RuleValue,
  SingleCredential,
  SingleRule,
  SingleRuleValue
} from "./types";

function falseComparator(): Promise<boolean> {
  return Promise.resolve(false);
}

function equalComparator<T>(x: T, y: T): Promise<boolean> {
  return Promise.resolve(x === y);
}

function predicateComparator<T>(
  x: T,
  f: (x: T) => Promise<boolean>
): Promise<boolean> {
  return f(x);
}

function selectLastComparator<T>(y: T) {
  if (typeof y === "function") {
    return predicateComparator;
  }
  return equalComparator;
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
    let hasCompare = false;
    for (key in obj) {
      hasCompare = true;
      const y: K = obj[key];
      const match = await comparator(x, y);
      if (!match) {
        return false;
      }
    }
    return hasCompare;
  };
}

const checkRuleValue = (
  credentialValue: CredentialValue,
  ruleValue: RuleValue
): Promise<boolean> => {
  if (Array.isArray(ruleValue)) {
    return some(checkRuleValue)(credentialValue, ruleValue);
  } else if (typeof ruleValue === "function") {
    return predicateComparator(credentialValue, ruleValue);
  } else if (typeof ruleValue === "object") {
    return all(checkRuleValue)(credentialValue, ruleValue);
  }
  return checkSingleRuleValue(credentialValue, ruleValue);
};

const checkSingleRuleValue = (
  credentialValue: CredentialValue,
  ruleValue: SingleRuleValue
): Promise<boolean> => {
  if (Array.isArray(credentialValue)) {
    return some(checkSingleRuleValue)(ruleValue, credentialValue);
  }
  // @ts-ignore
  return selectLastComparator(ruleValue)(credentialValue, ruleValue);
};

const checkSingleCredential = async (
  rule: SingleRule,
  credential: SingleCredential
) => {
  for (const key in rule) {
    const credentialValue = credential[key as CredentialKey];
    const ruleValue = rule[key as CredentialKey] as SingleRuleValue;
    // @ts-ignore
    const match = await checkRuleValue(credentialValue, ruleValue);
    if (!match) {
      return false;
    }
  }
  return true;
};

const selectCheckRuleFn = (rule: Rule) => {
  if (Array.isArray(rule)) {
    return some(checkRules);
  } else if (typeof rule === "function") {
    return predicateComparator;
  } else if (isRuleValue(rule)) {
    return flip(some(checkSingleCredential));
  }
  return all(checkRules);
};

export function checkRules(
  credentials: Credential,
  rule: Rule
): Promise<boolean> {
  const f = selectCheckRuleFn(rule);
  // @ts-ignore
  return f(Array.isArray(credentials) ? credentials : [credentials], rule);
}
