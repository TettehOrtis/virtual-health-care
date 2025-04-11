import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DoctorCardProps {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  price: number;
  availableToday?: boolean;
  avatar?: string;
}

const DoctorCard = ({
  id,
  name,
  specialty,
  experience,
  rating,
  price,
  availableToday = false,
  avatar,
}: DoctorCardProps) => {
  const router = useRouter();
  
  const handleBookAppointment = () => {
    // Simply redirect to auth page when booking is attempted
    router.push('/auth');
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-bold">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-medium text-lg">{name}</h3>
                {availableToday && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap mt-1 sm:mt-0">
                    Available Today
                  </Badge>
                )}
              </div>
              
              <p className="text-blue-600 font-medium">{specialty || "Specialist"}</p>
              
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">• {experience} years of experience</span>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <span className="font-semibold text-lg">${price}</span>
                <span className="text-sm text-gray-500">per consultation</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t p-4 bg-gray-50">
          <Button 
            onClick={handleBookAppointment} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Book Appointment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorCard;