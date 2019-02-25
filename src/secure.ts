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
  readonly guards?: Guard;
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
  return async function<ExtraDataType = any>(
    secureParams: SecureParams<ExtraDataType> = {}
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

    const { guards = {}, onSuccess, onFail, extraData } = secureParams;
    const { roles = [], rules = [] } = ({} = await getCredentials());

    if (roles.includes(Role.ADMIN)) {
      return Promise.resolve(true);
    }

    const result = await checkGuard(rules, guards, data, extraData);

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
