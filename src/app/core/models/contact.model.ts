import { Contact } from '../interfaces/contact.interface';

export class ContactModel implements Contact {
  id?: number;
  name: string;
  phone?: string;

  constructor(data: Contact) {
    this.id = data.id;
    this.name = data.name;
    this.phone = data.phone;
  }

  hasPhoneNumber(): boolean {
    return !!this.phone;
  }
}