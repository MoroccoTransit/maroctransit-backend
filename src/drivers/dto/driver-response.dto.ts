export class DriverResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cin: string;
  phone: string;
  address: string;
  licenseNumber: string;
  licenseExpiryDate: Date;
  isAvailable: boolean;
  joinedAt: Date;
  lastUpdatedAt: Date;

  constructor(driver: any) {
    this.id = driver.id;
    this.firstName = driver.firstName;
    this.lastName = driver.lastName;
    this.email = driver.user?.email;
    this.cin = driver.cin;
    this.phone = driver.phone;
    this.address = driver.address;
    this.licenseNumber = driver.licenseNumber;
    this.licenseExpiryDate = driver.licenseExpiryDate;
    this.isAvailable = driver.isAvailable;
    this.joinedAt = driver.joinedAt;
    this.lastUpdatedAt = driver.lastUpdatedAt;
  }
}
