
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, ExternalLink, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PartnerSite {
  id: number;
  name: string;
  website: string;
  contact_email: string;
  contact_name: string;
  domain_authority: number;
  partnership_status: 'potential' | 'contacted' | 'active' | 'declined';
  notes: string;
  referral_traffic?: number;
  created_at: string;
  updated_at: string;
}

const StatusBadge = ({ status }: { status: PartnerSite['partnership_status'] }) => {
  const statusConfig = {
    potential: { color: 'bg-slate-500', text: 'Potential' },
    contacted: { color: 'bg-blue-500', text: 'Contacted' },
    active: { color: 'bg-green-500', text: 'Active' },
    declined: { color: 'bg-red-500', text: 'Declined' }
  };
  
  return (
    <Badge className={statusConfig[status].color}>
      {statusConfig[status].text}
    </Badge>
  );
};

const ContentPartnerships: React.FC = () => {
  const [partnerSites, setPartnerSites] = useState<PartnerSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentSite, setCurrentSite] = useState<Partial<PartnerSite>>({
    name: '',
    website: '',
    contact_email: '',
    contact_name: '',
    domain_authority: 0,
    partnership_status: 'potential',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPartnerSites();
  }, []);

  const fetchPartnerSites = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_sites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartnerSites((data || []) as any);
    } catch (error: any) {
      console.error('Error fetching partner sites:', error);
      toast({
        title: 'Error',
        description: `Failed to load partner sites: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date().toISOString();
      const siteData = {
        ...currentSite,
        updated_at: now,
        created_at: currentSite.id ? undefined : now,
      };

      let response;
      if (currentSite.id) {
        // Update existing record
        response = await supabase
          .from('partner_sites')
          .update(siteData)
          .eq('id', currentSite.id)
          .select();
      } else {
        // Insert new record
        response = await supabase
          .from('partner_sites')
          .insert(siteData as any)
          .select();
      }

      if (response.error) throw response.error;
      
      toast({
        title: currentSite.id ? 'Partner Updated' : 'Partner Added',
        description: `Successfully ${currentSite.id ? 'updated' : 'added'} ${currentSite.name}`,
      });
      
      setFormOpen(false);
      setCurrentSite({
        name: '',
        website: '',
        contact_email: '',
        contact_name: '',
        domain_authority: 0,
        partnership_status: 'potential',
        notes: ''
      });
      
      fetchPartnerSites();
    } catch (error: any) {
      console.error('Error saving partner site:', error);
      toast({
        title: 'Error',
        description: `Failed to save: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const editSite = (site: PartnerSite) => {
    setCurrentSite(site);
    setFormOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSite(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentSite(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Partnerships</h2>
        <div className="flex space-x-2">
          <Button 
            onClick={() => fetchPartnerSites()} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => {
              setCurrentSite({
                name: '',
                website: '',
                contact_email: '',
                contact_name: '',
                domain_authority: 0,
                partnership_status: 'potential',
                notes: ''
              });
              setFormOpen(true);
            }} 
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Partner
          </Button>
        </div>
      </div>
      
      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{currentSite.id ? 'Edit' : 'Add'} Partner Site</CardTitle>
            <CardDescription>
              {currentSite.id 
                ? 'Update information about this partner site' 
                : 'Add a new potential content partnership opportunity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Site Name</label>
                  <Input 
                    id="name"
                    name="name"
                    value={currentSite.name}
                    onChange={handleInputChange}
                    placeholder="Partner site name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm font-medium">Website URL</label>
                  <Input 
                    id="website"
                    name="website"
                    value={currentSite.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact_name" className="text-sm font-medium">Contact Name</label>
                  <Input 
                    id="contact_name"
                    name="contact_name"
                    value={currentSite.contact_name}
                    onChange={handleInputChange}
                    placeholder="Contact person"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contact_email" className="text-sm font-medium">Contact Email</label>
                  <Input 
                    id="contact_email"
                    name="contact_email"
                    value={currentSite.contact_email}
                    onChange={handleInputChange}
                    placeholder="contact@example.com"
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="domain_authority" className="text-sm font-medium">Domain Authority</label>
                  <Input 
                    id="domain_authority"
                    name="domain_authority"
                    value={currentSite.domain_authority}
                    onChange={handleInputChange}
                    type="number"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="partnership_status" className="text-sm font-medium">Status</label>
                  <Select 
                    value={currentSite.partnership_status} 
                    onValueChange={(value) => handleSelectChange('partnership_status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="potential">Potential</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                <Textarea 
                  id="notes"
                  name="notes"
                  value={currentSite.notes}
                  onChange={handleInputChange}
                  placeholder="Add any relevant notes about this partnership opportunity"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {currentSite.id ? 'Update' : 'Add'} Partner
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Partner Sites</CardTitle>
          <CardDescription>
            Manage your content partnership opportunities and track their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading partner sites...
            </div>
          ) : partnerSites.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="mb-4">No content partnerships added yet.</p>
              <Button onClick={() => setFormOpen(true)}>Add Your First Partner</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Domain Authority</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnerSites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell>
                        <div className="font-medium">{site.name}</div>
                        <div className="text-sm text-muted-foreground">
                          <a 
                            href={site.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center"
                          >
                            {site.website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={site.partnership_status} />
                      </TableCell>
                      <TableCell>{site.domain_authority || 'N/A'}</TableCell>
                      <TableCell>
                        <div>{site.contact_name}</div>
                        <div className="text-sm text-muted-foreground">{site.contact_email}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => editSite(site)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-500"
                          >
                            <BarChart className="h-4 w-4" />
                            <span className="sr-only">Analytics</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Partnership Proposal Template */}
      <Card>
        <CardHeader>
          <CardTitle>Partnership Proposal Template</CardTitle>
          <CardDescription>
            A customizable template for reaching out to potential content partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-md bg-muted/50">
            <h3 className="text-lg font-medium mb-2">Subject: Content Partnership Opportunity with CuizIN</h3>
            <p className="mb-4">Hello [Contact Name],</p>
            <p className="mb-3">
              I hope this email finds you well. My name is [Your Name] from CuizIN, a free quiz platform that helps users learn while earning rewards through daily challenges and fun quizzes.
            </p>
            <p className="mb-3">
              I've been following [Partner Site Name]'s content and am impressed with your [specific compliment about their content]. I believe our audiences have similar interests, and we could create value for both our communities through a content partnership.
            </p>
            <p className="mb-3">
              <strong>Here's what we can offer:</strong>
            </p>
            <ul className="list-disc pl-6 mb-3 space-y-1">
              <li>Custom quiz content related to your site's topics</li>
              <li>Cross-promotion on our platform (reaching [number] monthly active users)</li>
              <li>Guest posting opportunities with high-quality educational content</li>
              <li>Social media mentions and newsletter features</li>
            </ul>
            <p className="mb-3">
              <strong>Benefits for your audience:</strong>
            </p>
            <ul className="list-disc pl-6 mb-3 space-y-1">
              <li>Interactive learning experiences through our quiz platform</li>
              <li>Opportunity to earn rewards while engaging with your content</li>
              <li>Access to our educational resources on [relevant topics]</li>
            </ul>
            <p className="mb-4">
              I'd love to discuss this opportunity further and explore how we might collaborate. Would you be available for a brief call next week to discuss potential partnership ideas?
            </p>
            <p className="mb-1">Looking forward to hearing from you,</p>
            <p>[Your Name]</p>
            <p>CuizIN - Partnership Manager</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Traffic Tracking Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Measuring Partnership ROI</CardTitle>
          <CardDescription>
            Best practices for tracking the impact of your content partnerships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">UTM Tracking Parameters</h3>
              <p className="text-muted-foreground">
                For each partnership, create unique UTM parameters to track referral traffic in your analytics:
              </p>
              <code className="block bg-muted p-2 rounded-md mt-2 text-sm">
                https://quizin.com/?utm_source=[partner_site]&utm_medium=content_partnership&utm_campaign=quiz_backlinks
              </code>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Custom Landing Pages</h3>
              <p className="text-muted-foreground">
                Consider creating partner-specific landing pages to better track conversions and engagement from each content partnership.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Regular Performance Reviews</h3>
              <p className="text-muted-foreground">
                Schedule monthly reviews of partnership performance, examining referral traffic, user engagement, and conversion metrics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentPartnerships;
