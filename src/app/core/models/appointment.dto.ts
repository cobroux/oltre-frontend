export interface AppointmentDTO {
  id: number;
  title: string;
  description?: string;
  location?: string;
  apptDate: string;
  apptTime?: string;
  apptType: 'MEDICAL' | 'SPORT' | 'PERSO' | 'TRAVAIL' | 'AUTRE';
}