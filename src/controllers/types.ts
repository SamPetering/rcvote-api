export type ControllerError = {
  status: 400 | 404 | 500;
  success: boolean;
  message: string;
};

type DataResult<T> = [T, null];
type ErrorResult = [null, ControllerError];

export type ControllerResult<T> = DataResult<T> | ErrorResult;
export type AsyncControllerResult<T> = Promise<ControllerResult<T>>;
