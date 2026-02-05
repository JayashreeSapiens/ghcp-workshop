'use client';

import { cn } from "@/lib/utils";
import { SettingsIcon, UsersIcon, Building2, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoHome, GoHomeFill } from "react-icons/go";

import { CiBasketball } from "react-icons/ci";
import { FaBasketball, FaWarehouse, FaFootball } from "react-icons/fa6";
import { SiGithubcopilot } from "react-icons/si";
import { MdOutlineSportsHandball, MdSportsFootball } from "react-icons/md";
import { useAuthContext } from "@/components/auth-provider";

const routes = [
  {
    label: "Home",
    href: "/",
    icon: GoHome,
    activeIcon: GoHomeFill,
  },
  {
    label: "NBA Scores",
    href: "/nba-scores",
    icon: CiBasketball,
    activeIcon: FaBasketball,
  },
  {
    label: "Cricket Scores",
    href: "/nba-scores/cricket",
    icon: MdOutlineSportsHandball,
    activeIcon: MdOutlineSportsHandball,
  },
  {
    label: "Football Scores",
    href: "/football-scores",
    icon: MdSportsFootball,
    activeIcon: MdSportsFootball,
  },
  {
    label: "NBA Stadiums",
    href: "/stadiums",
    icon: Building2,
    activeIcon: Building2,
  },
  {
    label: "Optimization",
    href: "/optimization",
    icon: SiGithubcopilot,
    activeIcon: SiGithubcopilot,
  },
  {
    label: "Player Registration",
    href: "/add-player-info",
    icon: UsersIcon,
    activeIcon: UsersIcon,
  },
];

export const Navigation = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ul className="flex flex-col">
      {routes.map((item) => {
        const isActive = false;
        const Icon = isActive ? item.activeIcon : item.icon;

        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-md font-medium hover:text-primary transition text-neutral-500",
                isActive && "bg-white shadow-sm hover:opacity-100 text-primary"
              )}
            >
              <Icon className="size-5 text-neutral-500" />
              {item.label}
            </div>
          </Link>
        );
      })}

      {/* Separator */}
      <div className="my-2 border-t border-neutral-200" />

      {/* Authentication Section */}
      {isAuthenticated ? (
        <>
          {/* User Info */}
          {user && (
            <div className="px-2.5 py-2 text-xs text-neutral-500">
              <p className="font-semibold text-neutral-700">{user.username}</p>
              <p className="capitalize">{user.role}</p>
            </div>
          )}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 p-2.5 rounded-md font-medium hover:text-primary transition text-neutral-500 w-full text-left hover:bg-neutral-100"
          >
            <LogOut className="size-5 text-neutral-500" />
            Logout
          </button>
        </>
      ) : (
        <Link href="/login">
          <div className="flex items-center gap-2.5 p-2.5 rounded-md font-medium hover:text-primary transition text-neutral-500 hover:bg-neutral-100">
            <LogIn className="size-5 text-neutral-500" />
            Login
          </div>
        </Link>
      )}
    </ul>
  );
};
