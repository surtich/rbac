enum Action {
  CREATE = "CREATE",
  FIND = "FIND",
  GET = "GET",
  DELETE = "DELETE",
  UPDATE = "UPDATE"
}

enum Resource {
  PROFILE = "PROFILE",
  COMMENT = "COMMENT",
  IMAGE = "IMAGE",
  VIDEO = "VIDE"
}

enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
  GUESS = "GUESS"
}

interface IArrayValue<R> extends Array<IValue<R>> {}
type IObject<R> = {
  readonly [index: string]: IValue<R>;
};
type IPredicate<R> = (x: R) => boolean | Promise<boolean>;
type IFunction<R> = (x: R) => IValue<R> | Promise<IValue<R>>;
//type IPromise<R> = Promise<IValue<R>>;

type IValue<R> =
  | R
  | IArrayValue<R>
  | IObject<R>
  | IPredicate<R>
  | IFunction<R>
  | boolean
  | Promise<boolean>;
//| IPromise<R>;

interface IRule {
  readonly action?: IValue<Action>;
  readonly resource?: IValue<Resource>;
  readonly role?: IValue<Role>;
}

const x: IRule = {
  action: () => [{}]
};

type Credential = IRule;
type Guard = IRule;

type Comparator<C, R> = (credential: C, rule: R) => Promise<boolean>;
