export default function HabitNewPage() {
  return (
    <main>
      <h1>SCR-003 習慣作成</h1>
      <p>/habits/new</p>
      <form action="/api/habits" method="POST">
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
    </main>
  );
}
