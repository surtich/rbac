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

export type CredentialValue = Action | Resource | Role;

export type ArrayRuleValue = Action[] | Resource[] | Role[];

export type SingleRuleValue = CredentialValue;

export type RuleValue = SingleRuleValue | ArrayRuleValue;

export interface Credential {
  readonly action: Action | Action[];
  readonly resource: Resource | Resource[];
  readonly role: Role | Role[];
}

export interface SingleRule {
  readonly action?: Action;
  readonly resource?: Resource;
  readonly role?: Role;
}

export interface ObjectRule {
  readonly [index: string]: Rule;
}

export interface ArrayRule extends Array<Rule> {}

export type Rule = SingleRule | ObjectRule | ArrayRule;

export const isActionRule = (rule: Rule) => {
  return (
    typeof rule === "object" &&
    Object.keys(rule).every(key => Object.keys(CredentialKey).includes(key))
  );
};
