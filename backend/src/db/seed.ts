import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.config';
import { User, Stadium, Match, Gate, SmartBin, TransitSchedule, Incident } from './models';

const seed = async () => {
  try {
    console.log('Starting Database Seeding...');
    await sequelize.sync({ force: true });
    console.log('Database schema synced (tables dropped and recreated).');

    // 1. Seed Users
    const fanPassword = await bcrypt.hash('fanpassword123', 10);
    const organizerPassword = await bcrypt.hash('organizerpassword123', 10);

    const users = await User.bulkCreate([
      { name: 'John Doe', email: 'fan@stadiumiq.com', passwordHash: fanPassword, role: 'fan' },
      { name: 'Charlie Brown', email: 'organizer@stadiumiq.com', passwordHash: organizerPassword, role: 'organizer' }
    ]);
    console.log(`Seeded ${users.length} users.`);

    // 2. Seed Stadiums
    const stadiums = await Stadium.bulkCreate([
      { name: 'SoFi Stadium', city: 'Los Angeles', capacity: 70000, lat: 33.9534, lng: -118.3390 },
      { name: 'MetLife Stadium', city: 'New York/New Jersey', capacity: 82500, lat: 40.8135, lng: -74.0743 },
      { name: 'BC Place', city: 'Vancouver', capacity: 54000, lat: 49.2767, lng: -123.1120 }
    ]);
    console.log(`Seeded ${stadiums.length} stadiums.`);

    const sofi = stadiums[0];
    const metlife = stadiums[1];
    const bcPlace = stadiums[2];

    // 3. Seed Matches
    const matches = await Match.bulkCreate([
      { homeTeam: 'USA', awayTeam: 'England', dateTime: new Date('2026-06-15T18:00:00Z'), status: 'scheduled', score: '0-0', stadiumId: sofi.id },
      { homeTeam: 'Mexico', awayTeam: 'Argentina', dateTime: new Date('2026-06-18T20:00:00Z'), status: 'scheduled', score: '0-0', stadiumId: sofi.id },
      { homeTeam: 'Canada', awayTeam: 'France', dateTime: new Date('2026-06-20T17:00:00Z'), status: 'scheduled', score: '0-0', stadiumId: bcPlace.id },
      { homeTeam: 'Brazil', awayTeam: 'Germany', dateTime: new Date('2026-06-22T19:00:00Z'), status: 'scheduled', score: '0-0', stadiumId: metlife.id }
    ]);
    console.log(`Seeded ${matches.length} matches.`);

    // 4. Seed Gates
    const gates = await Gate.bulkCreate([
      { name: 'Gate A (North)', flowRate: 60, status: 'open', currentQueueSize: 150, stadiumId: sofi.id },
      { name: 'Gate B (South)', flowRate: 45, status: 'bottleneck', currentQueueSize: 450, stadiumId: sofi.id },
      { name: 'Gate C (East)', flowRate: 70, status: 'open', currentQueueSize: 80, stadiumId: sofi.id },
      { name: 'Gate D (West)', flowRate: 10, status: 'closed', currentQueueSize: 0, stadiumId: sofi.id },

      { name: 'Gate 1 (Main)', flowRate: 80, status: 'open', currentQueueSize: 200, stadiumId: metlife.id },
      { name: 'Gate 2 (Side)', flowRate: 50, status: 'open', currentQueueSize: 120, stadiumId: metlife.id },
      { name: 'Gate 3 (VIP)', flowRate: 30, status: 'open', currentQueueSize: 15, stadiumId: metlife.id }
    ]);
    console.log(`Seeded ${gates.length} gates.`);

    // 5. Seed Smart Bins
    const bins = await SmartBin.bulkCreate([
      { zoneName: 'Concourse A North', fillLevel: 45, status: 'normal', locationDetails: 'Near Section 105', stadiumId: sofi.id },
      { zoneName: 'Concourse B South', fillLevel: 92, status: 'full', locationDetails: 'Near Section 120 Food Court', stadiumId: sofi.id },
      { zoneName: 'Upper Deck East', fillLevel: 20, status: 'normal', locationDetails: 'Near Section 302', stadiumId: sofi.id },
      { zoneName: 'Concourse C West', fillLevel: 88, status: 'full', locationDetails: 'Near Section 215 restrooms', stadiumId: sofi.id },

      { zoneName: 'Plaza Entrance', fillLevel: 30, status: 'normal', locationDetails: 'Near Ticket Booths', stadiumId: metlife.id },
      { zoneName: 'Concourse East', fillLevel: 95, status: 'full', locationDetails: 'Near Section 112 Hotdog Stall', stadiumId: metlife.id }
    ]);
    console.log(`Seeded ${bins.length} smart bins.`);

    // 6. Seed Transit Schedules
    const transit = await TransitSchedule.bulkCreate([
      { transportType: 'metro', routeName: 'Gold Line (SoFi Stadium Express)', frequencyMinutes: 5, status: 'on-time', delayDetails: '' },
      { transportType: 'shuttle', routeName: 'Parking Lot C Shuttle', frequencyMinutes: 10, status: 'delayed', delayDetails: 'Heavy traffic at Century Blvd' },
      { transportType: 'bus', routeName: 'Line 211 (Metro Bus)', frequencyMinutes: 15, status: 'on-time', delayDetails: '' },
      { transportType: 'metro', routeName: 'Secaucus Junction Link (MetLife Express)', frequencyMinutes: 6, status: 'on-time', delayDetails: '' }
    ]);
    console.log(`Seeded ${transit.length} transit lines.`);

    // 7. Seed Incidents
    const incidents = await Incident.bulkCreate([
      { reportedBy: 'Alice Smith', description: 'Minor medical assistance required: Heat exhaustion at Section 105 row M.', severity: 'medium', status: 'open', responseAction: 'First aid dispatch initiated.' },
      { reportedBy: 'Bob Johnson', description: 'Smart Bin Concourse B South is overflowing. Liquid spill detected on floor.', severity: 'low', status: 'open', responseAction: 'Cleaning crew alerted.' },
      { reportedBy: 'System Sensor Alert', description: 'Gate B South bottleneck detected. Flow rate dropped below threshold (under 15 people/min).', severity: 'high', status: 'open', responseAction: 'Directing excess arrivals to Gate A via stadium signs.' }
    ]);
    console.log(`Seeded ${incidents.length} incidents.`);

    console.log('Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

if (require.main === module || !module.parent) {
  seed();
}

export default seed;
