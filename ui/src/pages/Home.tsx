import Sidebar from "../components/SideBar";
import MobileNav from "../components/MobileNav";

const Home = () => {

  //
  // const [loading, setLoading] = useState(true);
  //
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gray-900 flex items-center justify-center">
  //       <div className="text-white text-xl">Loading...</div>
  //     </div>
  //   );
  // }
  //

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Visible on lg screens and up, fixed position */}
      <Sidebar />

      {/* Content Area: Takes margin for sidebar on lg screens */}
      <div className="lg:ml-64">
        <MobileNav />

        {/* Main Content */}
        <main className="flex-1 p-6">
        </main>

      </div>
    </div>
  );
};

export default Home;

