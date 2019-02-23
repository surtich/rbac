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

export type RuleValue = CredentialValue;

export interface Credential {
  readonly action: Action;
  readonly resource: Resource;
  readonly role: Role;
}

export interface ActionRule {
  readonly action?: Action;
  readonly resource?: Resource;
  readonly role?: Role;
}

export interface ObjectRule {
  readonly [index: string]: Rule;
}

export interface ArrayRule extends Array<Rule> {}

export type Rule = ActionRule | ObjectRule | ArrayRule;

export const isActionRule = (rule: Rule) => {
  return (
    typeof rule === "object" &&
    Object.keys(rule).every(key => Object.keys(CredentialKey).includes(key))
  );
};
