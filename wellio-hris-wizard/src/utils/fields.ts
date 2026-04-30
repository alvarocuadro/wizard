import type { FieldType } from './types';

export interface WizardField {
  key: string;
  label: string;
  required: boolean;
  maxLength?: number;
  type: FieldType;
  enumValues?: string[];
  aliases: string[];
  preview?: boolean;
}

export const FIELDS: WizardField[] = [
  {
    key: 'firstName',
    label: 'Nombre',
    required: true,
    maxLength: 40,
    type: 'text',
    preview: true,
    aliases: ['nombre', 'nombres', 'first name', 'firstname', 'given name', 'name'],
  },
  {
    key: 'lastName',
    label: 'Apellido',
    required: true,
    maxLength: 40,
    type: 'text',
    preview: true,
    aliases: ['apellido', 'apellidos', 'last name', 'lastname', 'surname', 'family name'],
  },
  {
    key: 'employeeId',
    label: 'Legajo',
    required: true,
    maxLength: 15,
    type: 'text',
    preview: true,
    aliases: [
      'legajo', 'id empleado', 'employee id', 'employeeid', 'nro legajo',
      'numero de legajo', 'número de legajo', 'matricula', 'matrícula',
      'codigo empleado', 'código empleado',
    ],
  },
  {
    key: 'hireDate',
    label: 'Fecha de ingreso',
    required: true,
    type: 'date',
    preview: true,
    aliases: ['fecha de ingreso', 'ingreso', 'alta', 'fecha alta', 'hire date', 'start date', 'joining date', 'fecha de alta'],
  },
  {
    key: 'workEmail',
    label: 'Email laboral',
    required: true,
    type: 'email',
    preview: true,
    aliases: [
      'mail laboral', 'email laboral', 'correo laboral', 'e-mail laboral',
      'work email', 'business email', 'email corporativo', 'correo corporativo',
      'mail corporativo', 'email trabajo',
    ],
  },
  {
    key: 'address',
    label: 'Domicilio',
    required: false,
    maxLength: 200,
    type: 'text',
    aliases: ['domicilio', 'direccion', 'dirección', 'address', 'street', 'calle', 'domicilio completo'],
  },
  {
    key: 'city',
    label: 'Localidad / Ciudad',
    required: false,
    maxLength: 60,
    type: 'text',
    aliases: ['localidad', 'ciudad', 'city', 'town', 'municipio'],
  },
  {
    key: 'state',
    label: 'Provincia / Estado',
    required: false,
    maxLength: 60,
    type: 'text',
    aliases: ['provincia', 'estado', 'province', 'state', 'region', 'región'],
  },
  {
    key: 'postalCode',
    label: 'Código postal',
    required: false,
    maxLength: 15,
    type: 'text',
    aliases: ['codigo postal', 'código postal', 'cp', 'postal code', 'zip', 'zip code'],
  },
  {
    key: 'country',
    label: 'País',
    required: false,
    maxLength: 60,
    type: 'text',
    aliases: ['pais', 'país', 'country'],
  },
  {
    key: 'personalEmail',
    label: 'Email personal',
    required: false,
    type: 'email',
    aliases: ['email personal', 'mail personal', 'correo personal', 'personal email', 'private email'],
  },
  {
    key: 'documentNumber',
    label: 'Número de documento',
    required: false,
    maxLength: 30,
    type: 'text',
    aliases: ['numero de documento', 'número de documento', 'documento', 'dni', 'document number', 'id number'],
  },
  {
    key: 'taxId',
    label: 'Identificador tributario',
    required: false,
    maxLength: 60,
    type: 'text',
    aliases: ['identificador tributario', 'cuit', 'cuil', 'tax id', 'tax identifier', 'nif', 'vat'],
  },
  {
    key: 'birthDate',
    label: 'Fecha de nacimiento',
    required: false,
    type: 'date',
    aliases: ['fecha de nacimiento', 'nacimiento', 'birth date', 'dob', 'date of birth', 'fec nac'],
  },
  {
    key: 'nationality',
    label: 'Nacionalidad',
    required: false,
    maxLength: 60,
    type: 'text',
    aliases: ['nacionalidad', 'nationality'],
  },
  {
    key: 'gender',
    label: 'Género',
    required: false,
    maxLength: 25,
    type: 'text',
    aliases: ['genero', 'género', 'gender', 'sex'],
  },
  {
    key: 'location',
    label: 'Ubicación',
    required: false,
    maxLength: 100,
    type: 'text',
    aliases: ['ubicacion', 'ubicación', 'location', 'site', 'sede'],
  },
  {
    key: 'workday',
    label: 'Jornada laboral',
    required: false,
    maxLength: 100,
    type: 'text',
    aliases: ['jornada laboral', 'jornada', 'working day', 'workday', 'tipo de jornada'],
  },
  {
    key: 'workSchedule',
    label: 'Horario de trabajo',
    required: false,
    maxLength: 100,
    type: 'text',
    aliases: ['horario de trabajo', 'horario', 'schedule', 'work schedule', 'turno'],
  },
  {
    key: 'workMode',
    label: 'Modalidad de trabajo',
    required: false,
    type: 'enum',
    enumValues: ['Presencial', 'Híbrido', 'Remoto'],
    aliases: ['modalidad de trabajo', 'modalidad', 'work mode', 'work modality', 'remote type', 'esquema laboral'],
  },
];

export const REQUIRED_FIELDS = FIELDS.filter((f) => f.required);
export const PREVIEW_FIELDS = FIELDS.filter((f) => f.preview);
