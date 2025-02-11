'use client';
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import CuentaForm from './CuentaForm';

export default function FloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center text-2xl"
        aria-label="Crear nueva cuenta"
      >
        +
      </button>

      {/* Modal */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        {/* Overlay de fondo */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Contenedor del modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-xl w-full bg-white rounded-lg shadow-xl p-6">
            <Dialog.Title className="text-2xl font-bold mb-4">
              Crear Nueva Cuenta
            </Dialog.Title>
            
            <CuentaForm onSuccess={() => setIsOpen(false)} />
            
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
