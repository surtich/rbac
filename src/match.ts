import {
  Credential,
  CredentialKey,
  CredentialValue,
  IPredicate,
  isRuleValue,
  Rule,
  RuleKey,
  RuleValue,
  SingleCredential,
  SingleRule,
  SingleRuleValue,
  PredicateRuleValue
} from "./types";

function falseComparator(): Promise<boolean> {
  return Promise.resolve(false);
}

function equalComparator<T>(x: T, y: T): Promise<boolean> {
  return Promise.resolve(x === y);
}

function predicateComparator<T>(
  x: T,
  f: (y: T) => Promise<boolean>
): Promise<boolean> {
  return f(x);
}

function selectLastComparator<T>(y: T | IPredicate<T>) {
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
  let match = true;
  for (const key in rule) {
    const credentialValue = credential[key as CredentialKey] as CredentialValue;
    const ruleValue = rule[key as RuleKey] as RuleValue;
    if (!credentialValue) {
      match = await missingCredentialKeyBehavior(
        ruleValue,
        credential,
        key as RuleKey
      );
    } else {
      match = await checkRuleValue(credentialValue, ruleValue);
    }
    if (!match) {
      return false;
    }
  }
  return match;
};

const missingCredentialKeyBehavior = (
  ruleValue: RuleValue,
  credential: SingleCredential,
  _key: RuleKey
): Promise<boolean> => {
  if (typeof ruleValue === "function") {
    const f = ruleValue as PredicateRuleValue;
    return f(credential);
  }
  return Promise.resolve(false);
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
  // @ts-ignore
  const f: (c: Credential, r: Rule) => Promise<boolean> = selectCheckRuleFn(
    rule
  );
  return f(Array.isArray(credentials) ? credentials : [credentials], rule);
}
