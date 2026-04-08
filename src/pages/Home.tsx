import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Droplet, Search, BellRing, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-red-50 to-white pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-primary text-sm font-medium mb-6">
              <Droplet className="w-4 h-4 fill-primary" />
              <span>Save lives today</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
              Find Blood Donors <br className="hidden md:block" />
              <span className="text-primary">When Seconds Count</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              A modern, privacy-focused platform connecting blood donors with those in emergency need. Fast, secure, and reliable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/search">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8">
                  <Search className="mr-2 h-5 w-5" />
                  Find Blood
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 bg-white">
                  <Droplet className="mr-2 h-5 w-5" />
                  Become a Donor
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-5xl overflow-hidden -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-red-200 blur-3xl"></div>
          <div className="absolute top-[40%] right-[10%] w-80 h-80 rounded-full bg-red-100 blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Location Based</h3>
              <p className="text-gray-600">Find donors near your hospital instantly using precise location matching.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Privacy First</h3>
              <p className="text-gray-600">Chat securely with donors without exposing your phone number initially.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-6 text-primary">
                <BellRing className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Emergency Alerts</h3>
              <p className="text-gray-600">Post urgent requests and notify eligible donors in your area immediately.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
