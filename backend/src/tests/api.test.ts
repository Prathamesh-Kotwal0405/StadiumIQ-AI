import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../app';
import { sequelize } from '../config/db.config';
import { User, Stadium, Match, Gate, SmartBin, TransitSchedule } from '../db/models';
import { JWT_SECRET } from '../config/auth.config';

let fanToken = '';
let organizerToken = '';

beforeAll(async () => {
  // Enforce testing sandbox database structure
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });

  const fanPass = await bcrypt.hash('fanpassword123', 10);
  const organizerPass = await bcrypt.hash('organizerpassword123', 10);

  // Load baseline testing records
  await User.bulkCreate([
    { name: 'Fan User', email: 'fan@stadiumiq.com', passwordHash: fanPass, role: 'fan' },
    { name: 'Organizer User', email: 'organizer@stadiumiq.com', passwordHash: organizerPass, role: 'organizer' }
  ]);

  const stadium = await Stadium.create({ 
    name: 'SoFi Stadium', 
    city: 'Los Angeles', 
    capacity: 70000, 
    lat: 33.9534, 
    lng: -118.3390 
  });

  await Match.create({ 
    homeTeam: 'USA', 
    awayTeam: 'England', 
    dateTime: new Date('2026-06-15T18:00:00Z'), 
    status: 'scheduled', 
    score: '0-0', 
    stadiumId: stadium.id 
  });

  await Gate.create({ name: 'Gate A', flowRate: 50, status: 'open', currentQueueSize: 100, stadiumId: stadium.id });
  await Gate.create({ name: 'Gate B', flowRate: 30, status: 'bottleneck', currentQueueSize: 200, stadiumId: stadium.id });

  await SmartBin.create({ zoneName: 'Concourse A', fillLevel: 85, status: 'full', locationDetails: 'Sec 101', stadiumId: stadium.id });

  await TransitSchedule.create({ transportType: 'metro', routeName: 'Gold Line', frequencyMinutes: 5, status: 'on-time', delayDetails: '' });

  // Pre-fetch organizer token via login route
  const organizerLogin = await request(app).post('/api/auth/login').send({ email: 'organizer@stadiumiq.com', password: 'organizerpassword123' });
  organizerToken = organizerLogin.body.token;

  // Manually sign testing JWT tokens for fan to check auth restrictions
  fanToken = jwt.sign({ id: 1, email: 'fan@stadiumiq.com', role: 'fan' }, JWT_SECRET);
});

describe('StadiumIQ REST API Integration Tests', () => {
  describe('Auth Endpoints', () => {
    it('should login and return a token for organizers', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'organizer@stadiumiq.com', password: 'organizerpassword123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('organizer');
    });

    it('should login and return a token for fans', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'fan@stadiumiq.com', password: 'fanpassword123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('fan');
    });

    it('should reject login for wrong credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'organizer@stadiumiq.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('should register a new user and prevent duplicates', async () => {
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'new@stadiumiq.com', password: 'password123', confirmPassword: 'password123' });
      expect(regRes.status).toBe(201);
      expect(regRes.body).toHaveProperty('token');

      const dupRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'New User', email: 'new@stadiumiq.com', password: 'password123', confirmPassword: 'password123' });
      expect(dupRes.status).toBe(409);
    });

    it('should fetch user profile with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fanToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('fan@stadiumiq.com');
    });
  });

  describe('Match Endpoints', () => {
    it('should list all matches with metadata', async () => {
      const res = await request(app).get('/api/matches');
      expect(res.status).toBe(200);
      expect(res.body.matches.length).toBeGreaterThan(0);
      expect(res.body.matches[0].homeTeam).toBe('USA');
    });

    it('should return 404 for non-existent match details', async () => {
      const res = await request(app).get('/api/matches/999');
      expect(res.status).toBe(404);
    });
  });

  describe('Operations & Gates Endpoints', () => {
    it('should list gates for a stadium', async () => {
      const res = await request(app).get('/api/stadiums/1/gates');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('should permit organizer to update gate flow parameters', async () => {
      const res = await request(app)
        .patch('/api/stadiums/1/gates/1/flow')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ flowRate: 65, currentQueueSize: 120, status: 'open' });
      expect(res.status).toBe(200);
      expect(res.body.gate.flowRate).toBe(65);
    });

    it('should block fans from updating gate parameters', async () => {
      const res = await request(app)
        .patch('/api/stadiums/1/gates/1/flow')
        .set('Authorization', `Bearer ${fanToken}`)
        .send({ flowRate: 65 });
      expect(res.status).toBe(403);
    });
  });

  describe('Smart Bins & Sustainability Endpoints', () => {
    it('should list smart bins without authentication', async () => {
      const res = await request(app).get('/api/stadiums/1/bins');
      expect(res.status).toBe(200);
      expect(res.body[0].zoneName).toBe('Concourse A');
    });

    it('should update smart bin levels without authentication', async () => {
      const res = await request(app)
        .patch('/api/stadiums/1/bins/1/level')
        .send({ fillLevel: 95 });
      expect(res.status).toBe(200);
      expect(res.body.bin.status).toBe('full');
    });
  });

  describe('Incident Dispatch Endpoints', () => {
    it('should allow users to report safety incidents', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${fanToken}`)
        .send({ description: 'Spill near gate A', severity: 'low' });
      expect(res.status).toBe(201);
      expect(res.body.incident.description).toBe('Spill near gate A');
    });

    it('should list incidents without authentication', async () => {
      const res = await request(app).get('/api/incidents');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('AI Copilot Assistant Endpoints', () => {
    it('should process user chatbot questions', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ query: 'How is the transit running?', language: 'en' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('response');
    });

    it('should cache consecutive duplicate chatbot questions', async () => {
      const res1 = await request(app)
        .post('/api/ai/chat')
        .send({ query: 'How is the transit running?', language: 'en' });
      expect(res1.status).toBe(200);
      const text1 = res1.body.response;

      const res2 = await request(app)
        .post('/api/ai/chat')
        .send({ query: 'How is the transit running?', language: 'en' });
      expect(res2.status).toBe(200);
      expect(res2.body.response).toBe(text1);
    });

    it('should allow organizers to query operations copilot', async () => {
      const res = await request(app)
        .post('/api/ai/ops-query')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ query: 'Summarize bin statuses.' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('response');
    });

    it('should deny fans from accessing operations copilot', async () => {
      const res = await request(app)
        .post('/api/ai/ops-query')
        .set('Authorization', `Bearer ${fanToken}`)
        .send({ query: 'Summarize bin statuses.' });
      expect(res.status).toBe(403);
    });
  });

  describe('Transit Schedule & Logistics Endpoints', () => {
    it('should list transit schedules', async () => {
      const res = await request(app).get('/api/transit/schedules');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].routeName).toBe('Gold Line');
    });

    it('should allow organizers to update transit status', async () => {
      const res = await request(app)
        .patch('/api/transit/schedules/1')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'delayed', delayDetails: 'Track work' });
      expect(res.status).toBe(200);
      expect(res.body.schedule.status).toBe('delayed');
    });

    it('should deny fans from updating transit status', async () => {
      const res = await request(app)
        .patch('/api/transit/schedules/1')
        .set('Authorization', `Bearer ${fanToken}`)
        .send({ status: 'on-time' });
      expect(res.status).toBe(403);
    });
  });

  describe('Incident Management Actions', () => {
    it('should permit organizer to update incident resolution action', async () => {
      const res = await request(app)
        .patch('/api/incidents/1')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'resolved', responseAction: 'Resolved and cleared' });
      expect(res.status).toBe(200);
      expect(res.body.incident.status).toBe('resolved');
    });

    it('should deny fans from updating incident parameters', async () => {
      const res = await request(app)
        .patch('/api/incidents/1')
        .set('Authorization', `Bearer ${fanToken}`)
        .send({ status: 'resolved' });
      expect(res.status).toBe(403);
    });
  });

  describe('Sustainability Route Optimizations', () => {
    it('should allow organizers to retrieve optimized collection routes', async () => {
      const res = await request(app)
        .get('/api/stadiums/1/bins/routes')
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('route');
      expect(res.body).toHaveProperty('summary');
    });

    it('should deny fans from retrieving optimized collection routes', async () => {
      const res = await request(app)
        .get('/api/stadiums/1/bins/routes')
        .set('Authorization', `Bearer ${fanToken}`);
      expect(res.status).toBe(403);
    });
  });
});
