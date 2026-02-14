
import { ReportService } from '../src/services/reporter';

const run = () => {
    console.log('Testing Report Generation...');
    const reporter = new ReportService();
    const md = reporter.generateMarkdown();

    console.log('Report Content Preview:');
    console.log('-----------------------------------');
    console.log(md.substring(0, 500) + '...');
    console.log('-----------------------------------');
};

run();
