import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/mainlayout";
import DoctorCard from "@/components/dashboard/doctorcard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Doctor {
    id: string;
    user: {
        fullName: string;
        email: string;
    };
    specialization: string;
    yearsOfExperience: number;
    consultationFee: number;
    rating: number;
    availableToday: boolean;
}

const FindDoctor = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
    const [priceRange, setPriceRange] = useState([0, 250]);
    const [availableTodayOnly, setAvailableTodayOnly] = useState(false);
    const [sortBy, setSortBy] = useState("rating");
    const [specialties, setSpecialties] = useState<string[]>([]);

    // Fetch doctors
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await fetch("/api/doctors");

                if (!response.ok) {
                    throw new Error("Failed to fetch doctors");
                }

                const data = await response.json();
                setDoctors(data);

                // Extract unique specialties for filter
                const specializations = data.map((doctor: Doctor) => doctor.specialization || "");
                const filteredSpecializations = specializations.filter(item => item !== "");
                const uniqueSpecialties = Array.from(new Set(filteredSpecializations));
                setSpecialties(["All Specialties", ...uniqueSpecialties]);
            } catch (error) {
                console.error("Error fetching doctors:", error);
                toast.error("Failed to load doctors");
            } finally {
                setLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    // Filter doctors based on search and filters
    const filteredDoctors = doctors.filter((doctor) => {
        // Search term filter
        const searchMatch =
            doctor.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());

        // Specialty filter
        const specialtyMatch =
            selectedSpecialty === "All Specialties" ||
            doctor.specialization === selectedSpecialty;

        // Price range filter
        const priceMatch =
            doctor.consultationFee >= priceRange[0] && doctor.consultationFee <= priceRange[1];

        // Availability filter
        const availabilityMatch =
            !availableTodayOnly || doctor.availableToday;

        return searchMatch && specialtyMatch && priceMatch && availabilityMatch;
    });

    // Sort doctors based on selected criteria
    const sortedDoctors = [...filteredDoctors].sort((a, b) => {
        switch (sortBy) {
            case "rating":
                return b.rating - a.rating;
            case "price-low":
                return a.consultationFee - b.consultationFee;
            case "price-high":
                return b.consultationFee - a.consultationFee;
            case "experience":
                return b.yearsOfExperience - a.yearsOfExperience;
            default:
                return 0;
        }
    });

    return (
        <MainLayout>
            <div className="py-12 bg-blue-50">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-12">
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">Find the Right Doctor</h1>
                        <p className="text-gray-600">
                            Browse our network of qualified healthcare professionals and book an appointment instantly.
                        </p>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                            <div>
                                <h3 className="font-medium mb-3">Search</h3>
                                <Input
                                    placeholder="Search by name or specialty"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div>
                                <h3 className="font-medium mb-3">Specialty</h3>
                                <Select
                                    value={selectedSpecialty}
                                    onValueChange={setSelectedSpecialty}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select specialty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {specialties.map((specialty) => (
                                            <SelectItem key={specialty} value={specialty}>
                                                {specialty}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <h3 className="font-medium mb-3">Price Range</h3>
                                <div className="pt-4 px-2">
                                    <Slider
                                        defaultValue={[0, 250]}
                                        max={250}
                                        step={10}
                                        value={priceRange}
                                        onValueChange={setPriceRange}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                                    <span>${priceRange[0]}</span>
                                    <span>${priceRange[1]}</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="available-today"
                                    checked={availableTodayOnly}
                                    onCheckedChange={(checked) =>
                                        setAvailableTodayOnly(checked === true)
                                    }
                                />
                                <Label htmlFor="available-today">Available Today Only</Label>
                            </div>
                        </div>
                    </div>

                    {/* Doctor listings */}
                    <div className="lg:col-span-3">
                        <div className="mb-4 flex items-center justify-between">
                            {loading ? (
                                <p className="text-gray-600">Loading doctors...</p>
                            ) : (
                                <p className="text-gray-600">
                                    Found <span className="font-medium text-gray-900">{sortedDoctors.length}</span> doctors
                                </p>
                            )}

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rating">Sort by Rating</SelectItem>
                                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                                    <SelectItem value="experience">Most Experienced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map((item) => (
                                    <div key={item} className="bg-white rounded-lg border border-gray-200 p-6 h-64 animate-pulse">
                                        <div className="flex items-start gap-4">
                                            <div className="h-16 w-16 rounded-full bg-gray-200"></div>
                                            <div className="space-y-3 flex-1">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                            </div>
                                        </div>
                                        <div className="mt-6 h-10 bg-gray-200 rounded w-full"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {sortedDoctors.length > 0 ? (
                                    sortedDoctors.map((doctor) => (
                                        <DoctorCard
                                            key={doctor.id}
                                            id={doctor.id}
                                            name={`Dr. ${doctor.user.fullName}`}
                                            specialty={doctor.specialization}
                                            experience={doctor.yearsOfExperience}
                                            rating={doctor.rating}
                                            price={doctor.consultationFee}
                                            availableToday={doctor.availableToday}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12">
                                        <p className="text-gray-500 mb-2">No doctors match your search criteria.</p>
                                        <p className="text-gray-500">Try adjusting your filters or search term.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default FindDoctor; 