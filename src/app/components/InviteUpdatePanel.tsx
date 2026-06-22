import { useState, useEffect } from "react";
import {
  interviewInviteStatusLabels,
  interviewRoundLabels,
  type InterviewInviteStatus,
  type InterviewRecord,
  type InterviewRound,
} from "../../features/interviews/types";

export function InviteUpdatePanel({
  interview,
  onUpdate,
}: {
  interview: InterviewRecord;
  onUpdate: (interview: InterviewRecord) => void;
}) {
  const [inviteStatus, setInviteStatus] = useState<InterviewInviteStatus>(
    interview.inviteStatus ?? "not_scheduled",
  );
  const [scheduledAt, setScheduledAt] = useState(interview.scheduledAt ?? "");
  const [confirmedAt, setConfirmedAt] = useState(interview.confirmedAt ?? "");
  const [nextRound, setNextRound] = useState<InterviewRound>(
    interview.nextRound ?? "second",
  );
  const [nextScheduledAt, setNextScheduledAt] = useState(interview.nextScheduledAt ?? "");
  const [inviteNotes, setInviteNotes] = useState(interview.inviteNotes ?? "");

  useEffect(() => {
    setInviteStatus(interview.inviteStatus ?? "not_scheduled");
    setScheduledAt(interview.scheduledAt ?? "");
    setConfirmedAt(interview.confirmedAt ?? "");
    setNextRound(interview.nextRound ?? "second");
    setNextScheduledAt(interview.nextScheduledAt ?? "");
    setInviteNotes(interview.inviteNotes ?? "");
  }, [interview.id]);

  function handleInviteUpdate() {
    onUpdate({
      ...interview,
      inviteStatus,
      scheduledAt,
      confirmedAt,
      nextRound,
      nextScheduledAt,
      inviteNotes,
    });
  }

  return (
    <div className="invite-update-panel">
      <div className="section-title-row">
        <h3>面试邀约</h3>
        <button className="secondary-action" type="button" onClick={handleInviteUpdate}>
          更新邀约
        </button>
      </div>
      <div className="form-grid">
        <label>
          邀约状态
          <select
            value={inviteStatus}
            onChange={(event) =>
              setInviteStatus(event.target.value as InterviewInviteStatus)
            }
          >
            {Object.entries(interviewInviteStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          本轮面试时间
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
        </label>
        <label>
          确认时间
          <input
            type="datetime-local"
            value={confirmedAt}
            onChange={(event) => setConfirmedAt(event.target.value)}
          />
        </label>
        <label>
          下一轮
          <select
            value={nextRound}
            onChange={(event) => setNextRound(event.target.value as InterviewRound)}
          >
            {Object.entries(interviewRoundLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          下一轮时间
          <input
            type="datetime-local"
            value={nextScheduledAt}
            onChange={(event) => setNextScheduledAt(event.target.value)}
          />
        </label>
      </div>
      <label>
        邀约备注
        <input
          value={inviteNotes}
          onChange={(event) => setInviteNotes(event.target.value)}
          placeholder="例如：HR 通知二面，需准备 Google Play 合规案例"
        />
      </label>
    </div>
  );
}
