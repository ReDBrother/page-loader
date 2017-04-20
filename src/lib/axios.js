import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';

axios.defaults.adapter = httpAdapter;

export default axios;
