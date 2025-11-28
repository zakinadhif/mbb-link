import React from "react";
import { useFetcher } from "react-router";

type JSONResponse<T> = {
  success: boolean;
  data: T;
  error?: {
    message: string;
  };
};

type Options = {
  /**
   * @description
   * Called after a fetcher returns data back & if `success` property in the data is `true`
   */
  onSuccess?: (loaderData: any) => void;
  /**
   * @description
   * Called after a fetcher returns data back & if `success` property in the data is `false`
   */
  onError?: (loaderData: any) => void;
  /**
   * @description
   * Unique identifier of `submit` being made. This is intended to help
   * identify which API requests are made on pages where multiple API requests happen.
   *
   * @reference
   * This idea was inspired from the `queryKey` prop featured in react-query
   * React Query, Using query keys: https://tanstack.com/query/v4/docs/react/guides/query-keys
   */
  queryKey?: string;
};

type UseRemixSubmitStatus = "loading" | "idle";

/**
 * @description
 * A superset of remix's `useSubmit` hook.
 * To determine if a `submit` call is successfull, this currently
 * expects our loaders to return a JSON object of this shape:  { status: 'success | "error"; data: .. };
 * The `status` keyword in the JSON response is used to determin if an API call was successful or not.
 *
 * @example
 * const {submit} = useRemixSubmit((onSuccess: () => {..}, onError: () => {...}))
 */
export const useRemixFetcher = ({ onError, onSuccess }: Options = {}) => {
  const fetcher = useFetcher();
  const [transitionLog, setTransitionLog] = React.useState<UseRemixSubmitStatus[]>(["idle"]);

  /**
   * @description
   * Monitor fetcher.state in order to determine when to fire `onSuccess`, `onError` callbacks
   *
   * 1.['idle']
   * 2.['idle'. 'loading'] --------------------------------------------> we are in a loading state
   * 3.['idle'. 'loading'] && transition.state === 'idle'  ------------> we've finished a submission
   *
   * NOTE:
   * After a fetcher has completed, `fetcher.type` value will be 'done' indefinetely.
   * If we do a any sort of `setState` call in our lifecyle methods (onSuccess, onError etc)
   * that triggers a component re-render and thereby our `useRemixFetcher` hook would get called again
   * and our lifecycle method's could get called again, when we don't want them to, due to re-rendering
   * from a setState call inside of any of the lifecycle hooks (onSuccess,onError etc).
   * Thus we need to keep the concept of a transition log to ensure our lifecycle hooks don't get called
   * again after the first time they are called.
   */
  React.useEffect(() => {
    const hasFetcherFinishedSubmission = fetcher.state === "idle" && fetcher.data != null;
    const shouldAppendTransitionLog = transitionLog.length < 3 && fetcher.state === "loading";
    const shouldResetTransitionLog = transitionLog.length === 2 && fetcher.state === "idle";

    if (shouldAppendTransitionLog) {
      setTransitionLog([...transitionLog, "loading"]);
    } else if (shouldResetTransitionLog) {
      setTransitionLog(["idle"]);
    }

    // Handle calling onSuccess onError callcbacks
    if (onSuccess && fetcher?.data?.success === true && hasFetcherFinishedSubmission) {
      onSuccess(fetcher.data);
    } else if (onError && fetcher?.data?.success === false && hasFetcherFinishedSubmission) {
      onError(fetcher.data);
    }
  }, [fetcher.state]);

  return fetcher;
};
