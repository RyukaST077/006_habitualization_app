import { getSafeErrorMessage, shouldDisplayTraceId, type CommonUiErrorDto } from './common-ui-types';

type ErrorDisplayProps = {
  error: CommonUiErrorDto | null;
};

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  if (!error) {
    return null;
  }

  const safeMessage = getSafeErrorMessage(error);
  const showTraceId = shouldDisplayTraceId(error);

  if (error.status === 400) {
    return (
      <div data-display="field-under">
        <p>400</p>
        <p>{safeMessage}</p>
      </div>
    );
  }

  if (error.status === 403) {
    return (
      <div data-display="inline-top">
        <p>403</p>
        <p>{safeMessage}</p>
      </div>
    );
  }

  if (error.status === 409) {
    return (
      <div data-display="toast">
        <p>409</p>
        <p>{safeMessage}</p>
        <a href="/home">再開</a>
      </div>
    );
  }

  // status === 500 の場合のみ trace_id を表示する。
  // status !== 500 では trace_id を表示しない。
  return (
    <div data-display="toast">
      <p>500</p>
      <p>{safeMessage}</p>
      {showTraceId ? <p>trace_id: {error.trace_id}</p> : null}
    </div>
  );
}
