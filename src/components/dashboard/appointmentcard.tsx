import { Button } from "@/components/ui/button";
import { Calendar, Clock, VideoIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
}

interface AppointmentCardProps {
  id: string;
  doctor: Doctor;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "canceled";
  type: "video" | "in-person";
}

const AppointmentCard = ({
  id,
  doctor,
  date,
  time,
  status,
  type,
}: AppointmentCardProps) => {
  const [currentStatus, setCurrentStatus] = useState(status);
  
  const handleCancel = () => {
    // In a real app, this would make an API call
    setCurrentStatus("canceled");
    toast.success("Appointment canceled successfully.");
  };
  
  const handleJoin = () => {
    // In a real app, this would navigate to the video call page
    toast.info("Joining video consultation...");
  };
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-medical-light p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-medical-primary text-white flex items-center justify-center font-medium">
            {doctor.name.charAt(0)}
          </div>
          <div>
            <h4 className="font-medium">{doctor.name}</h4>
            <p className="text-sm text-gray-600">{doctor.specialty}</p>
          </div>
        </div>
        <div>
          <span 
            className={`text-sm px-2 py-1 rounded-full ${
              currentStatus === "upcoming" 
                ? "bg-blue-100 text-blue-800" 
                : currentStatus === "completed"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <VideoIcon className="h-4 w-4" />
            <span>{type === "video" ? "Video Consultation" : "In-person Visit"}</span>
          </div>
        </div>
        
        {currentStatus === "upcoming" && (
          <div className="flex gap-2">
            {type === "video" && (
              <Button 
                onClick={handleJoin} 
                className="bg-medical-primary hover:bg-medical-accent"
              >
                Join Call
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
