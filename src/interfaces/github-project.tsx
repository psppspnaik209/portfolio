export interface GithubProject {
  name: string;
  full_name?: string;
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
}
