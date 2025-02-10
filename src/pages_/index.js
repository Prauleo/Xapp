import CuentaForm from '../components/CuentaForm';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Administrador de Cuentas</h1>
      <CuentaForm />
    </div>
  )
}