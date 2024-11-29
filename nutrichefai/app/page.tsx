import { auth } from "@/auth";
import HomeScreen from "./component/HomeScreen";
import CreateRecipePage from "./component/CreateRecipePage";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  return (
    <>
      <HomeScreen />
      <div className="mb-10">
        <CreateRecipePage userId={userId} />
      </div>
    </>
  );
}
