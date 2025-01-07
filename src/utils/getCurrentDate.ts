import * as moment from 'moment-timezone';

const getCurrentDate = () => {
    const fechaHoraActual = moment.tz('America/Montevideo').format('YYYY-MM-DD HH:mm:ss');
    return fechaHoraActual;
}

export default getCurrentDate;
