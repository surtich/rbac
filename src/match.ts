import {
  Guard,
  GuardKey,
  GuardValue,
  IPredicate,
  isGuardValue,
  PredicateGuardValue,
  Rule,
  RuleKey,
  RuleValue,
  SingleGuard,
  SingleGuardValue,
  SingleRule
} from "./types";

function falseComparator(): Promise<boolean> {
  return Promise.resolve(false);
}

function equalComparator<T>(x: T, y: T): Promise<boolean> {
  return Promise.resolve(x === y);
}

function createPredicateComparator<D, E, P>(data: D, extraData: E, params: P) {
  return function predicateComparator<K>(
    x: K,
    f: (x: K, y: D, z: E, p: P) => Promise<boolean>
  ): Promise<boolean> {
    return f(x, data, extraData, params);
  };
}

function flip<T, K, L>(f: (x: K, y: T) => L) {
  return (y: T, x: K) => f(x, y);
}

type Comparator<T, K> = (x: T, y: K) => Promise<boolean>;

function some<T, K>(comparator: Comparator<T, K>) {
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

function all<T, K>(comparator: Comparator<T, K>) {
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

export function checkGuard<
  AdditonalDataType = any,
  ExtraDataType = any,
  ProtectedParamDataType = any
>(
  rules: Rule,
  guards: Guard,
  data?: AdditonalDataType,
  extraData?: ExtraDataType,
  protectedParamData?: ProtectedParamDataType
): Promise<boolean> {
  const predicateComparator = createPredicateComparator<
    AdditonalDataType,
    ExtraDataType,
    ProtectedParamDataType
  >(
    data as AdditonalDataType,
    extraData as ExtraDataType,
    protectedParamData as ProtectedParamDataType
  );

  function selectLastComparator<T>(y: T | IPredicate<T>) {
    if (typeof y === "function") {
      return predicateComparator;
    }
    return equalComparator;
  }

  const checkGuardValue = (
    ruleValue: RuleValue,
    guardValue: GuardValue
  ): Promise<boolean> => {
    if (Array.isArray(guardValue)) {
      return some(checkGuardValue)(ruleValue, guardValue);
    } else if (typeof guardValue === "function") {
      return predicateComparator(ruleValue, guardValue);
    } else if (typeof guardValue === "object") {
      return all(checkGuardValue)(ruleValue, guardValue);
    }
    return checkSingleGuardValue(ruleValue, guardValue);
  };

  const checkSingleGuardValue = (
    ruleValue: RuleValue,
    guardValue: SingleGuardValue
  ): Promise<boolean> => {
    if (Array.isArray(ruleValue)) {
      return some(checkSingleGuardValue)(guardValue, ruleValue);
    } else if (typeof ruleValue === "function") {
      return predicateComparator(guardValue, ruleValue);
    } else if (typeof ruleValue === "object") {
      // @ts-ignore
      return all(selectLastComparator(guardValue))(guardValue, ruleValue);
    }
    // @ts-ignore
    return selectLastComparator(guardValue)(ruleValue, guardValue);
  };

  const missingRuleKeyBehavior = (
    guardValue: GuardValue,
    rule: SingleRule,
    _key: GuardKey
  ): Promise<boolean> => {
    if (typeof guardValue === "function") {
      const g = guardValue as PredicateGuardValue;
      return predicateComparator(rule, g);
    }
    return Promise.resolve(false);
  };

  const checkSingleRule = async (guard: SingleGuard, rule: SingleRule) => {
    let match = true;
    for (const key in guard) {
      const ruleValue = rule[key as RuleKey] as RuleValue;
      const guardValue = guard[key as GuardKey] as GuardValue;
      if (!ruleValue) {
        match = await missingRuleKeyBehavior(guardValue, rule, key as GuardKey);
      } else {
        match = await checkGuardValue(ruleValue, guardValue);
      }
      if (!match) {
        return false;
      }
    }
    return match;
  };

  const selectCheckGuardFn = (guard: Guard) => {
    if (Array.isArray(guard)) {
      return some(checkGuard);
    } else if (typeof guard === "function") {
      return predicateComparator;
    } else if (isGuardValue(guard)) {
      return flip(some(checkSingleRule));
    }
    return all(checkGuard);
  };

  // @ts-ignore
  const f: (r: Rule, c: Guard) => Promise<boolean> = selectCheckGuardFn(guards);
  return f(Array.isArray(rules) ? rules : [rules], guards);
}
