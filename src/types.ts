export enum CredentialKey {
  "action" = "action",
  "resource" = "resource",
  "role" = "role"
}
export enum Action {
  CREATE = "CREATE",
  SELECT = "SELECT"
}

export enum Resource {
  SPACE = "SPACE",
  COMMENT = "COMMENT"
}

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER"
}

export type SingleCredentialValue = Action | Resource | Role;

export type ArrayCredentialValue = Action[] | Resource[] | Role[];

export interface SingleCredential {
  readonly action?: Action | Action[];
  readonly resource?: Resource | Action[];
  readonly role?: Role | Role[];
}

export type ArrayRuleValue = ArrayCredentialValue;

export type SingleRuleValue = SingleCredentialValue;

export type CredentialValue = SingleCredentialValue | ArrayCredentialValue;

export type RuleValue = SingleRuleValue | ArrayRuleValue;

export type SingleRule = SingleCredential;

export interface ArrayCredential extends Array<Credential> {}

export type Credential = SingleCredential | SingleCredential[];

export interface ObjectRule {
  readonly [index: string]: Rule;
}

export interface ArrayRule extends Array<Rule> {}

export type Rule = SingleRule | ObjectRule | ArrayRule;

export const isRuleValue = (rule: Rule) => {
  return (
    typeof rule === "object" &&
    Object.keys(rule).every(key => Object.keys(CredentialKey).includes(key))
  );
};
