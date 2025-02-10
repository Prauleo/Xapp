"use client";

import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function CuentaForm() {
  const [formData, setFormData] = useState({
    nombre: '',
    tono: 'formal',
    estilo_visual: '',
    publico_objetivo: ''
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
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6">Crear Nueva Cuenta</h2>
      
      {message && (
        <div className={`p-4 mb-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre de la cuenta</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tono</label>
          <select
            name="tono"
            value={formData.tono}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="formal">Formal</option>
            <option value="humoristico">Humorístico</option>
            <option value="tecnico">Técnico</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Estilo Visual</label>
          <input
            type="text"
            name="estilo_visual"
            value={formData.estilo_visual}
            onChange={handleChange}
            placeholder="Ej: Minimalista, Colorido, Profesional"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Público Objetivo</label>
          <textarea
            name="publico_objetivo"
            value={formData.publico_objetivo}
            onChange={handleChange}
            placeholder="Describe tu audiencia objetivo"
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Crear Cuenta
        </button>
      </form>
    </div>
  );
}
