export interface CityBreakProps {
    _id?: string;
    name: string;
    startDate: Date,
    endDate: Date,
    price: number,
    transportIncluded: boolean,
    userId: string,
    status: number,
    version: number
}
