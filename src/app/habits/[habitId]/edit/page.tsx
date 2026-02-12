type HabitEditPageProps = {
  params: {
    habitId: string;
  };
};

export default function HabitEditPage({ params }: HabitEditPageProps) {
  return (
    <main>
      <h1>SCR-004 習慣編集</h1>
      <p>{`/habits/${params.habitId}/edit`}</p>
    </main>
  );
}
