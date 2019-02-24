export enum RuleKey {
  "action" = "action",
  "resource" = "resource",
  "role" = "role"
}
export enum GuardKey {
  "action" = "action",
  "resource" = "resource",
  "role" = "role",
  "predicate" = "predicate"
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
  USER = "USER",
  GUESS = "GUESS"
}

type SingleRuleValue = Action | Resource | Role;

type ArrayRuleValue = Action[] | Resource[] | Role[];

type ObjectRuleValue =
  | {
      readonly [index: string]: Action;
    }
  | {
      readonly [index: string]: Resource;
    }
  | {
      readonly [index: string]: Role;
    };

interface IArrayRuleValue<R> extends Array<IRuleValue<R>> {}

export type IPredicate<R> = (x: R, y: any, z: any) => Promise<boolean>;

type IRuleValue<R> =
  | R
  | IArrayRuleValue<R>
  | {
      readonly [index: string]: IRuleValue<R>;
    }
  | IPredicate<R>;

export interface SingleRule {
  readonly action?: IRuleValue<Action>;
  readonly resource?: IRuleValue<Resource>;
  readonly role?: IRuleValue<Role>;
}

export interface SingleGuard extends SingleRule {
  readonly predicate?: IRuleValue<PredicateGuardValue>;
}

export type SingleGuardValue = SingleRuleValue;

type ArrayGuardValue = ArrayRuleValue;

export type PredicateGuardValue = IPredicate<SingleRule>;

export type RuleValue = SingleRuleValue | ArrayRuleValue | ObjectRuleValue;

export type GuardValue = SingleGuardValue | ArrayGuardValue | ObjectRuleValue;

export type Rule = SingleRule | SingleRule[];

interface ObjectGuard {
  readonly [index: string]: Guard;
}

type PredicateGuard = IPredicate<Rule>;

interface ArrayGuard extends Array<Guard> {}

export type Guard = SingleGuard | ObjectGuard | ArrayGuard | PredicateGuard;

export const isGuardValue = (guard: Guard) => {
  return (
    typeof guard === "object" &&
    Object.keys(guard).length > 0 &&
    Object.keys(guard).every(key => Object.keys(GuardKey).includes(key))
  );
};
