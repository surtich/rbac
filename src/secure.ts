import { checkGuard } from "./match";
import { Guard, Role, SingleRule } from "./types";

export type UserCredentials = { roles?: Role[]; rules?: SingleRule[] };

export interface SecureConfig<
  AdditionalDataType,
  SuccessType = any,
  FailType = any
> {
  readonly getCredentials: () => Promise<UserCredentials>;
  readonly data?: AdditionalDataType;
  readonly onDefaultSuccess?: SuccessType;
  readonly onDefaultFail?: FailType;
}

export interface SecureParams<
  AdditionalDataType,
  SuccessType = any,
  FailType = any
> {
  readonly extraData?: AdditionalDataType;
  readonly onSuccess?: SuccessType;
  readonly onFail?: FailType;
}

type SecureResult = any;

export function makeSecure<AdditionalDataType = any>({
  getCredentials,
  onDefaultSuccess = true,
  onDefaultFail = false,
  data
}: SecureConfig<AdditionalDataType>) {
  return async function<ExtraDataType = any, ProtectedParamsDataType = any>(
    guards: Guard = {},
    secureParams: SecureParams<ExtraDataType> = {},
    functionParams?: ProtectedParamsDataType
  ): Promise<SecureResult> {
    const returnSecureResult = (value: any) => {
      if (value instanceof Error) {
        throw value;
      } else if (typeof value === "function") {
        return value(data, extraData);
      } else {
        return value;
      }
    };

    const { onSuccess, onFail, extraData } = secureParams;
    const credentials = await getCredentials();
    const { roles = [], rules = [] } = credentials || {};

    let result = roles.includes(Role.ADMIN);
    if (!result) {
      result = await checkGuard(rules, guards, data, extraData, functionParams);
    }

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
}
