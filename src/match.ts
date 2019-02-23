import {
  ArrayRule,
  ArrayRuleValue,
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

const checkObjectRule = async (credentials: Credential[], rule: ObjectRule) => {
  let ruleKey: string;
  for (ruleKey in rule) {
    const actualRule: Rule = rule[ruleKey];
    const match = await checkRules(credentials, actualRule);
    if (!match) {
      return false;
    }
  }
  return true;
};

const checkArrayRule = async (credentials: Credential[], rule: ArrayRule) => {
  for (const ruleValue of rule) {
    const match = await checkRules(credentials, ruleValue);
    if (match) {
      return true;
    }
  }
  return false;
};

const checkArrayRuleValue = async (
  credentialValue: CredentialValue,
  arrayRuleValue: ArrayRuleValue
) => {
  for (const ruleValue of arrayRuleValue) {
    const match = await checkSingleRuleValue(credentialValue, ruleValue);
    if (match) {
      return true;
    }
  }
  return false;
};

const checkSingleRuleValue = (
  credentialValue: CredentialValue,
  ruleValue: SingleRuleValue
) => {
  return Promise.resolve(credentialValue === ruleValue);
};

const checkCredentials = async (
  credentials: Credential[],
  rule: SingleRule
) => {
  for (const credential of credentials) {
    const match = await checkSingleCredential(credential, rule);
    if (match) {
      return true;
    }
  }
  return false;
};

const checkSingleCredential = async (
  credential: Credential,
  rule: SingleRule
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

export const checkRules = async (credentials: Credential[], rule: Rule) => {
  const f = selectCheckRuleFn(rule);
  // @ts-ignore
  return f(credentials, rule);
};
