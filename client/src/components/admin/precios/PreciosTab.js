import AumentoForm from './AumentoForm';
import ListaPrecios from './ListaPrecios';
import DemoraAjustes from './DemoraAjustes';

export default function PreciosTab({ state, actualizar, mostrar }) {
  return (
    <>
      <AumentoForm state={state} actualizar={actualizar} />
      <ListaPrecios state={state} actualizar={actualizar} mostrar={mostrar} />
      <DemoraAjustes state={state} actualizar={actualizar} />
    </>
  );
}
