export interface Neurona {
  id: string;
  nombre: string;
  tipo: string;
  grupo_fisico: string;
  estado: string;
  valor_activacion: number;
  coherencia: number;
  confianza: number;
}

export interface Resultado {
  id: string;
  producto: string;
  problema_detectado: string;
  causas_fisicas: string[];
  soluciones_propuestas: string[];
  confianza_general: number;
  neuronas_activadas: number;
  inferencias_generadas: number;
  coherencia_global: number;
  created_at: string;
}