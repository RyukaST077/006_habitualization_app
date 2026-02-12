type HabitEditPageProps = {
  params: {
    habitId: string;
  };
};

export default function HabitEditPage({ params }: HabitEditPageProps) {
  const updateAction = `/api/habits/${params.habitId}`;
  const archiveAction = `/api/habits/${params.habitId}/archive`;
  const resumeAction = `/api/habits/${params.habitId}/resume`;

  return (
    <main>
      <h1>SCR-004 習慣編集</h1>
      <p>{`/habits/${params.habitId}/edit`}</p>
      <form action={updateAction} method="PATCH">
        <label htmlFor="name">name</label>
        <input id="name" name="name" minLength={1} maxLength={80} required />

        <label htmlFor="displayOrder">displayOrder</label>
        <input
          id="displayOrder"
          name="displayOrder"
          type="number"
          min={1}
          max={9999}
          defaultValue={1}
          required
        />

        <button type="submit">保存</button>
      </form>

      <form action={archiveAction} method="POST">
        <button type="submit">archive</button>
      </form>

      <form action={resumeAction} method="POST">
        <button type="submit">resume</button>
      </form>

      <a href="/home">SCR-002へ遷移</a>
    </main>
  );
}
