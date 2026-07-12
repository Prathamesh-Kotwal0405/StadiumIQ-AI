import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/db.config';

export class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare role: 'fan' | 'staff' | 'volunteer' | 'organizer';
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('fan', 'organizer'),
    allowNull: false
  }
}, { sequelize, modelName: 'user' });

export class Stadium extends Model {
  declare id: number;
  declare name: string;
  declare city: string;
  declare capacity: number;
  declare lat: number;
  declare lng: number;
}

Stadium.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, { sequelize, modelName: 'stadium' });

export class Match extends Model {
  declare id: number;
  declare homeTeam: string;
  declare awayTeam: string;
  declare dateTime: Date;
  declare status: 'scheduled' | 'live' | 'completed';
  declare score: string;
  declare stadiumId: number;
}

Match.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  homeTeam: {
    type: DataTypes.STRING,
    allowNull: false
  },
  awayTeam: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'live', 'completed'),
    defaultValue: 'scheduled',
    allowNull: false
  },
  score: {
    type: DataTypes.STRING,
    defaultValue: '0-0',
    allowNull: false
  },
  stadiumId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, { sequelize, modelName: 'match' });

export class Gate extends Model {
  declare id: number;
  declare name: string;
  declare flowRate: number;
  declare status: 'open' | 'bottleneck' | 'closed';
  declare currentQueueSize: number;
  declare stadiumId: number;
}

Gate.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  flowRate: {
    type: DataTypes.INTEGER,
    defaultValue: 50
  },
  status: {
    type: DataTypes.ENUM('open', 'bottleneck', 'closed'),
    defaultValue: 'open',
    allowNull: false
  },
  currentQueueSize: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stadiumId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, { sequelize, modelName: 'gate' });

export class SmartBin extends Model {
  declare id: number;
  declare zoneName: string;
  declare fillLevel: number;
  declare status: 'normal' | 'full';
  declare locationDetails: string;
  declare stadiumId: number;
}

SmartBin.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  zoneName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fillLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('normal', 'full'),
    defaultValue: 'normal',
    allowNull: false
  },
  locationDetails: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stadiumId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, { sequelize, modelName: 'smart_bin' });

export class TransitSchedule extends Model {
  declare id: number;
  declare transportType: 'metro' | 'bus' | 'shuttle';
  declare routeName: string;
  declare frequencyMinutes: number;
  declare status: 'on-time' | 'delayed';
  declare delayDetails: string;
}

TransitSchedule.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  transportType: {
    type: DataTypes.ENUM('metro', 'bus', 'shuttle'),
    allowNull: false
  },
  routeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  frequencyMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('on-time', 'delayed'),
    defaultValue: 'on-time',
    allowNull: false
  },
  delayDetails: {
    type: DataTypes.STRING,
    defaultValue: ''
  }
}, { sequelize, modelName: 'transit_schedule' });

export class Incident extends Model {
  declare id: number;
  declare reportedBy: string;
  declare description: string;
  declare severity: 'low' | 'medium' | 'high';
  declare status: 'open' | 'resolved';
  declare responseAction: string;
}

Incident.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  reportedBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'low',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'resolved'),
    defaultValue: 'open',
    allowNull: false
  },
  responseAction: {
    type: DataTypes.STRING,
    defaultValue: ''
  }
}, { sequelize, modelName: 'incident' });

// Associations
Stadium.hasMany(Match, { foreignKey: 'stadiumId', onDelete: 'CASCADE' });
Match.belongsTo(Stadium, { foreignKey: 'stadiumId' });

Stadium.hasMany(Gate, { foreignKey: 'stadiumId', onDelete: 'CASCADE' });
Gate.belongsTo(Stadium, { foreignKey: 'stadiumId' });

Stadium.hasMany(SmartBin, { foreignKey: 'stadiumId', onDelete: 'CASCADE' });
SmartBin.belongsTo(Stadium, { foreignKey: 'stadiumId' });
