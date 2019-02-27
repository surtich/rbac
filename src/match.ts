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

import secureComparator from "./match2";

export function checkGuard<
  AdditonalDataType = any,
  ExtraDataType = any,
  ProtectedParamDataType = any
>(
  credentials: Rule,
  guards: Guard,
  _data?: AdditonalDataType,
  _extraData?: ExtraDataType,
  _protectedParamData?: ProtectedParamDataType
): Promise<boolean> {
  return secureComparator(credentials, guards);
}
