"use client";

import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function CuentaForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: '',
    tono: 'formal',
    estilo_visual: '',
    publico_objetivo: '',
    idioma: 'es'
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('cuentas')
        .insert([formData])
        .select();

      if (error) throw error;

      setMessage('¡Cuenta creada exitosamente!');
      setFormData({
        nombre: '',
        tono: 'formal',
        estilo_visual: '',
        publico_objetivo: ''
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-bg-secondary rounded-lg shadow-lg border border-border">
      <h2 className="text-2xl font-semibold mb-6 text-text-primary">Crear Nueva Cuenta</h2>
      
      {message && (
        <div className={`p-4 mb-4 rounded border ${message.includes('Error') ? 'border-red-500 bg-bg-primary text-red-400' : 'border-green-500 bg-bg-primary text-green-400'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary">Nombre de la cuenta</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-border bg-bg-primary text-text-primary shadow-sm focus:border-accent focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Tono</label>
          <select
            name="tono"
            value={formData.tono}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border bg-bg-primary text-text-primary shadow-sm focus:border-accent focus:ring-accent"
          >
            <option value="formal">Formal</option>
            <option value="humoristico">Humorístico</option>
            <option value="tecnico">Técnico</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Estilo Visual</label>
          <input
            type="text"
            name="estilo_visual"
            value={formData.estilo_visual}
            onChange={handleChange}
            placeholder="Ej: Minimalista, Colorido, Profesional"
            className="mt-1 block w-full rounded-md border-border bg-bg-primary text-text-primary shadow-sm focus:border-accent focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Público Objetivo</label>
          <textarea
            name="publico_objetivo"
            value={formData.publico_objetivo}
            onChange={handleChange}
            placeholder="Describe tu audiencia objetivo"
            rows="3"
            className="mt-1 block w-full rounded-md border-border bg-bg-primary text-text-primary shadow-sm focus:border-accent focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary">Idioma de publicación</label>
          <select
            name="idioma"
            value={formData.idioma}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border bg-bg-primary text-text-primary shadow-sm focus:border-accent focus:ring-accent"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-accent text-text-primary py-2 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary transition-opacity"
        >
          Crear Cuenta
        </button>
      </form>
    </div>
  );
}
