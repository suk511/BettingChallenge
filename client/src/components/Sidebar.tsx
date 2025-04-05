import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/hooks/use-auth";

const Sidebar = () => {
  const [location, setLocation] = useLocation();
  const { user } = useAuthContext();

  const navItems = [
    {
      href: "/",
      icon: "casino",
      text: "Betting Game",
    },
    {
      href: "/history",
      icon: "history",
      text: "Bet History",
    },
    {
      href: "/admin",
      icon: "admin_panel_settings",
      text: "Admin Panel",
      adminOnly: true,
    },
    {
      href: "/support",
      icon: "support_agent",
      text: "Support",
    },
  ];

  return (
    <nav className="bg-[#212121] text-white w-full md:w-64 md:min-h-screen">
      <div className="p-4">
        <ul>
          {navItems.map((item) => {
            // Skip admin panel item if user is not admin
            if (item.adminOnly && (!user || !user.isAdmin)) {
              return null;
            }

            return (
              <li key={item.href} className="mb-1">
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setLocation(item.href);
                  }}
                  className={cn(
                    "flex items-center p-3 rounded hover:bg-[#3f51b5]/40 transition-colors duration-200",
                    location === item.href
                      ? "bg-[#3f51b5] bg-opacity-80"
                      : ""
                  )}
                >
                  <span className="material-icons mr-3">{item.icon}</span>
                  <span>{item.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
