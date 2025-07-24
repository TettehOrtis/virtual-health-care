import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, VideoIcon, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Modal from "@/components/ui/modal";
import { toast } from "sonner";

interface AppointmentType {
    value: "VIDEO" | "IN_PERSON";
    label: string;
}

const APPOINTMENT_TYPES: AppointmentType[] = [
    { value: "VIDEO", label: "Video Consultation" },
    { value: "IN_PERSON", label: "In-person Visit" }
];

interface RescheduleProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: {
        id: string;
        date: string;
        time: string;
        type: AppointmentType["value"];
        patient: {
            fullName: string;
        };
    };
    onReschedule: (date: string, type: AppointmentType["value"]) => void;
}

export default function RescheduleAppointment({
    isOpen,
    onClose,
    appointment,
    onReschedule
}: RescheduleProps) {
    const [newDate, setNewDate] = useState<string>("");
    const [newType, setNewType] = useState<AppointmentType["value"]>(() => {
        if (!appointment || !appointment.type) {
            // Default to video consultation if appointment is null or type is missing
            return "VIDEO";
        }
        return appointment.type;
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!newDate) {
            toast.error("Please select a new date and time");
            return;
        }

        try {
            setIsLoading(true);
            await onReschedule(newDate, newType);
            toast.success("Appointment rescheduled successfully");
            onClose();
        } catch (error) {
            console.error("Error rescheduling appointment:", error);
            toast.error("Failed to reschedule appointment");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reschedule Appointment">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="currentDate">Current Appointment</Label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>{appointment?.date ? new Date(appointment.date).toLocaleDateString() : 'No date set'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>{appointment?.time || 'No time set'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                {appointment?.type === "VIDEO" ? (
                                    <>
                                        <VideoIcon className="h-4 w-4" />
                                        <span>Video Consultation</span>
                                    </>
                                ) : (
                                    <>
                                        <Users className="h-4 w-4" />
                                        <span>In-person Visit</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="newDate">New Date and Time</Label>
                    <Input
                        id="newDate"
                        type="datetime-local"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full"
                        min={new Date().toISOString().slice(0, 16)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="appointmentType">Appointment Type</Label>
                    <Select value={newType} onValueChange={(value) => setNewType(value as AppointmentType["value"])}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select appointment type" />
                        </SelectTrigger>
                        <SelectContent>
                            {APPOINTMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="mr-2">Rescheduling...</span>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </>
                        ) : (
                            "Reschedule Appointment"
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
