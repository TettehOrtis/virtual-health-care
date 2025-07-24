
'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, LogOut, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    supabaseId: string;
    doctorId?: string;
    patientId?: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check auth state on mount
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (currentSession?.user) {
            const supabaseUser = currentSession.user;
            const fullName = supabaseUser.user_metadata?.fullName || 
                           (supabaseUser.email ? supabaseUser.email.split('@')[0] : "User");
            
            // Fetch complete user profile from Prisma
            const { data: { user: dbUser } } = await supabase
              .from('users')
              .select('*, doctor(id), patient(id)')
              .eq('supabase_id', supabaseUser.id)
              .single();

            if (!dbUser) {
              console.error('User not found in Prisma database');
              return;
            }

            setUser({
              id: dbUser.id,
              supabaseId: supabaseUser.id,
              email: supabaseUser.email || '',
              role: dbUser.role || supabaseUser.user_metadata?.role || "authenticated",
              fullName,
              doctorId: dbUser.doctor?.id,
              patientId: dbUser.patient?.id
            });
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    });

    // Initial auth state check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session?.user) {
        setIsLoggedIn(false);
        setUser(null);
        return;
      }

      const user = session.user;
      const fullName = user.user_metadata?.fullName || 
                     (user.email ? user.email.split('@')[0] : "User");
      
      setUser({
        id: user.id,
        supabaseId: user.id,
        email: user.email || "",
        role: user.user_metadata?.role || "authenticated",
        fullName: fullName || "User",
      });
      setIsLoggedIn(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
    router.push("/");
  };

  const userInitials = user?.fullName
    ?.split(" ")
    .map((n) => n[0].toUpperCase())
    .join("") || "U";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" aria-label="Global">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-md p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-blue-600">MediCloudHub</span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:gap-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600">Home</Link>
            <Link href="/find-doctor" className="text-gray-700 hover:text-blue-600">Find Doctors</Link>
            <Link href="/services" className="text-gray-700 hover:text-blue-600">Services</Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600">About</Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full h-10 w-10 p-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/auth">Sign in</Link>
              </Button>
            )}

            <div className="flex md:hidden">
              <Button
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="-m-2.5 p-2.5 text-gray-700"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="flex flex-col gap-4 mt-6 pb-4">
              <Link href="/" className="text-base font-medium text-gray-900 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/find-doctor" className="text-base font-medium text-gray-900 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Find Doctors</Link>
              <Link href="/services" className="text-base font-medium text-gray-900 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Services</Link>
              <Link href="/about" className="text-base font-medium text-gray-900 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link href="/contact" className="text-base font-medium text-gray-900 hover:text-blue-600" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
