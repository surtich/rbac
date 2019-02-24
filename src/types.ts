export enum CredentialKey {
  "action" = "action",
  "resource" = "resource",
  "role" = "role"
}
export enum Action {
  CREATE = "CREATE",
  FIND = "FIND",
  GET = "GET",
  DELETE = "DELETE",
  UPDATE = "UPDATE"
}

export enum Resource {
  SPACE = "SPACE",
  COMMENT = "COMMENT"
}

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER"
}

type SingleCredentialValue = Action | Resource | Role;

type ArrayCredentialValue = Action[] | Resource[] | Role[];

type ObjectCredentialValue =
  | {
      readonly [index: string]: Action;
    }
  | {
      readonly [index: string]: Resource;
    }
  | {
      readonly [index: string]: Role;
    };

interface IArrayCredentialValue<C> extends Array<ICredentialValue<C>> {}

type ICredentialValue<C> =
  | C
  | IArrayCredentialValue<C>
  | {
      readonly [index: string]: ICredentialValue<C>;
    };

export interface SingleCredential {
  readonly action?: ICredentialValue<Action>;
  readonly resource?: ICredentialValue<Resource>;
  readonly role?: ICredentialValue<Role>;
}

export interface SingleRule extends SingleCredential {
  readonly predicate?: IArrayCredentialValue<PredicateRule>;
}

export type SingleRuleValue = SingleCredentialValue;

type ArrayRuleValue = ArrayCredentialValue;

export type CredentialValue =
  | SingleCredentialValue
  | ArrayCredentialValue
  | ObjectCredentialValue;

export type RuleValue =
  | SingleRuleValue
  | ArrayRuleValue
  | ObjectCredentialValue;

export type Credential = SingleCredential | SingleCredential[];

interface ObjectRule {
  readonly [index: string]: Rule;
}

type PredicateRule = (credential: Credential) => Promise<boolean>;

interface ArrayRule extends Array<Rule> {}

export type Rule = SingleRule | ObjectRule | ArrayRule | PredicateRule;

export const isRuleValue = (rule: Rule) => {
  return (
    typeof rule === "object" &&
    Object.keys(rule).every(key => Object.keys(CredentialKey).includes(key))
  );
};
