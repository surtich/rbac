import { checkGuard } from "./match";
import { Guard, Role, Rule, SingleRule } from "./types";

export type UserCredentials = { roles?: Role[]; rules?: SingleRule[] };

export interface SecureConfig {
  readonly getCredentials: () => Promise<UserCredentials>;
  readonly onDefaultSuccess?: any;
  readonly onDefaultFail?: any;
}

interface SecureParams {
  readonly guards?: Guard;
  readonly onSuccess?: any;
  readonly onFail?: any;
}

type SecureResult = any;

const returnSecureResult = (value: any) => {
  if (value instanceof Error) {
    throw value;
  } else if (typeof value === "function") {
    return value();
  } else {
    return value;
  }
};

export const secure = ({
  getCredentials,
  onDefaultSuccess = true,
  onDefaultFail = false
}: SecureConfig) => async (
  secureParams: SecureParams = {}
): Promise<SecureResult> => {
  const { guards = {}, onSuccess, onFail } = secureParams;
  const { roles = [], rules = [] } = ({} = await getCredentials());

  if (roles.includes(Role.ADMIN)) {
    return Promise.resolve(true);
  }

  const result = await checkGuard(rules, guards);

  return returnSecureResult(
    result === true
      ? "onSuccess" in secureParams
        ? onSuccess
        : onDefaultSuccess
      : "onFail" in secureParams
      ? onFail
      : onDefaultFail
  );
};
