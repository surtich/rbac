import {
  ActionRule,
  ArrayRule,
  Credential,
  CredentialKey,
  CredentialValue,
  isActionRule,
  ObjectRule,
  Rule,
  RuleValue
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

const checkRuleValue = (
  credentialValue: CredentialValue,
  ruleValue: RuleValue
) => {
  return Promise.resolve(credentialValue === ruleValue);
};

const checkCredentials = async (
  credentials: Credential[],
  rule: ActionRule
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
  rule: ActionRule
) => {
  for (const key in rule) {
    const credentialValue = credential[key as CredentialKey];
    const ruleValue = rule[key as CredentialKey] as RuleValue;
    const match = await checkRuleValue(credentialValue, ruleValue);
    if (!match) {
      return false;
    }
  }
  return true;
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
