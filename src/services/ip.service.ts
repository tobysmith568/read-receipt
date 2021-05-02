import { singleton } from "tsyringe";
import { HttpService } from "./http.service";

@singleton()
export class IpService {
  constructor(private readonly httpService: HttpService) {}

  public async getInfoFromIp(ip: string): Promise<IIPResponse | undefined> {
    const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,isp,mobile,proxy`;

    const httpResult = await this.httpService.get<IIPResponse>(url);

    return httpResult;
  }
}

export interface IIPResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  isp: string;
  mobile: boolean;
  proxy: boolean;
}
